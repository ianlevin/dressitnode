export default class User{
    id;
    username;
    password;
    email;
    pfp;
    gender;

    constructor(id,username,password,email,pfp,gender){
        this.id = id;
        this.username = username;
        this.password = password;
        this.email = email;
        this.pfp = pfp;
        this.gender = gender;
    }
}