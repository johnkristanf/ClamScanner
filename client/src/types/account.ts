
export type SignupCredentials = {
    fullname: string,
    address: string,

    email: string,
    password: string
    role:string
}

export type LoginCredentials = {
    device: string
    email: string,
    password: string
}

export interface InputData {
    label: keyof SignupCredentials; 
    type: string;
    placeholder: string;
    minLength?: number;
    pattern?: RegExp;
  
}

export const validEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


export type PersonnelAccounts = {
    user_id: number,
    fullname: string,
    email: string,
    address: string
}


export type adminLoginCredentials = {
    email: string,
    password: string
}

export interface InputType {
    label: keyof adminLoginCredentials; 
    type: string;
    placeholder: string;
}


export type AdminData = {
    id: number,
    email: string
}
