import { FieldErrors, LiteralUnion } from "react-hook-form";
import { LoginCredentials, SignupCredentials } from "../types/account";

function ValidateErrors(field: string, type: LiteralUnion<"required" | "min" | "max" | "maxLength" | "minLength" | "validate" | "value" | "setValueAs" | "shouldUnregister" | "onChange" | "onBlur" | "disabled" | "deps" | "pattern" | "valueAsNumber" | "valueAsDate", string> | undefined){

    const errorMessages: any = {
        required: {
            firstname: "First Name is Required",
            lastname: "Last Name is Required",
            email: "Email is Required",
            password: "Password is Required"
        },

        pattern: 'Invalid Email Address',
        minLength: 'Password must have at least 8 characters',
    }

    const message = type !== undefined ? errorMessages[type] : undefined;

    if (typeof message == 'object') {
        return <p className="text-red-800 text-center text-lg font-bold mb-3">{message[field]}</p>;
    }

    return <p className="text-red-800 text-center text-lg font-bold mb-3">{message}</p>;
}

export const SignupValidation = (errors: FieldErrors<SignupCredentials>) => {

    for (const fieldName in errors) {

        switch (fieldName) {
            case 'firstname':
                return ValidateErrors('firstname', errors.firstname?.type);
            case 'lastname':
                return ValidateErrors('lastname', errors.lastname?.type);
            case 'email':
                return ValidateErrors('email', errors.email?.type);
            case 'password':
                return ValidateErrors('password', errors.password?.type);
            default:
                break;
        }
    }
}
