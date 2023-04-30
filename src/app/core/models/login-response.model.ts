import {UserModel} from "./user.model";

export interface LoginResponseModel {
  token: string;
  user: UserModel;
}
