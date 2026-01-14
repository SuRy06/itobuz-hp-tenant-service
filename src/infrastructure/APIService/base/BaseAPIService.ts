import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

export abstract class BaseAPIService {
  protected readonly client: AxiosInstance;

  constructor(config?: AxiosRequestConfig) {
    this.client = axios.create(config);
  }

  protected async post<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }
}
