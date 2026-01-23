import { CustomAxiosRequestConfig } from "./axiosInstance.types";

// TODO: is this really needded?
export const isProtected: CustomAxiosRequestConfig = {
  requireAuth: true,
};
