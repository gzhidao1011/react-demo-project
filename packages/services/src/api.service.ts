import { APIServiceBase } from "./api.service.base";

export class APIService extends APIServiceBase {
  constructor(baseURL: string) {
    super(baseURL);
  }
}
export const apiService = new APIService("/api");
