const bcrypt = require('bcrypt');
const userModel = require("../../database/models/auth.model");
const otpModel = require("../../database/models/otp.model");
const otpGenerator = require("otp-generator");
const Login = async(request,response)=>{
    console.log("login page");
};

const sendOTP = async(request,response)=>{

    try{
        const {email} = request.body;

        //Check if the user is already present

        const findUser = await userModel.findOne({email});
        if(findUser){
            request.session.formData = null; // until resend otp option is not created
            return response.status(401).json({success:false,message:"Otp is already sent please re-send the otp if you haven't received it"});
        }
        let otp = otpGenerator.generate(6,{upperCaseAlphabets:false,lowerCaseAlphabets:false,specialChars:false});
        let otpObjectForDB = {email,otp};
        const createOTPINDB = await otpModel.create(otpObjectForDB);
        if(!createOTPINDB){
            request.session.formData = null;
            return response.status(403).json({success:true,message:"OTP not generated"});
        }
    }
    catch(error){
        console.error(error);
    }
};

const Register = async (request,response)=>{

    try{
        let {first_name,middle_name,last_name,age,city,address,district,email,password} = request.body;
        console.log(first_name,middle_name,last_name,age,city,address,district,email,password);
        if(!first_name|| !middle_name|| !last_name|| !age|| !city || !address || !district || !email || !password){
             return response.status(403).json({success:false,message:"All fields are required"});
        }
        if(!email.includes("@gmail.com")){
            return response(402).json({success:false,message:"Please provide correct email address"});
        }
        // now let's check if user already exists
        const checkingIfUserExists = await userModel.findOne({email});

        if(checkingIfUserExists){
            return response.status(400).json({success:false,message:"User already exists please login"});
        }
        //let's store the data into session temporarily
         request.session.formData = {
            first_name,middle_name,last_name,age,city,address,district,email,password
        };
            console.log("session created",request.session.formData);

        //now let's send the otp
        sendOTP(request,response).finally(()=>{
                response.redirect(`/rojgar/otp-verify?email=${email}`); // Redirect to OTP verification page
        }).catch((err)=>{
            request.session.formData = null;
            return response.status(500).json({success:false,message:err});
        })

    }catch(error){
        console.log(error);
    }

};




const verifyOTP = async(request,response)=>{
    try{

        let { email, otp1, otp2, otp3, otp4, otp5, otp6 }= request.body;
        // console.log(otp1,otp2);
        const otpCode = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;

        console.log(email);
        if(!email){
            request.session.formData = null;
            return response.status(401).json({success:false,message:"no email found"});
        }
        if(email){
            const findOTPFROMDATABASE = await otpModel.findOne({email:email});
            if(!findOTPFROMDATABASE){
                return response.status(404).json({success:false,message:"OTP not found please resend the otp"});
            }
            if(findOTPFROMDATABASE.otp !== otpCode){
                return response.status(401).json({success:false,message:"OTP not matched please provide correct otp"});
            }
            let {first_name,middle_name,last_name,age,city,address,district,password} = request.session.formData;
            const createNewUser = await userModel.create({
                firstName:first_name,
                middleName:middle_name,
                lastName:last_name,
                age:age,
                district:district,
                address:address,
                email:email,
                password:password,
                city:city,
            });
            if(createNewUser){
                request.session.formData = null;
                return response.redirect("/rojgar/welcome");
            }
            // return response.status(200).json({success:true,message:"Account created successfully"});
            request.session.formData = null;
            return response.status(401).json({success:false,message:"some error occurred please register again cannot save userData into database"});
        }
        request.session.formData = null;
        return response.status(404).json({success:false,message:"some error occurred please register again"});
    }catch(error){
      console.error(error.message);
    }
};
const ForgotPassword = async(request,response)=>{
    console.log("forgot password page");
};

module.exports = {Login,Register,verifyOTP,ForgotPassword};