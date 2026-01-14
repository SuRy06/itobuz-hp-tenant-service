import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { injectable } from "tsyringe";
import LOG from "../../library/logging";

@injectable()
export class ApiService {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000, // 10 seconds
      headers: {},
    });

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        LOG.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        LOG.error(`API Error: ${error.message}`, {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get(
        url,
        config
      );
      return response.data;
    } catch (error) {
      LOG.error(`GET request failed: ${url}`, error);
      throw error;
    }
  }

  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(
        url,
        data,
        config
      );

      if (response.status < 200 || response.status >= 300) {
        const errorData = response.data as { error_description?: string };
        throw new Error(errorData.error_description ?? "Request failed");
      }
      return response.data;
    } catch (error) {
      LOG.error(`POST request failed: ${url}`, error);
      throw error;
    }
  }

  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.put(
        url,
        data,
        config
      );
      return response.data;
    } catch (error) {
      LOG.error(`PUT request failed: ${url}`, error);
      throw error;
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.delete(
        url,
        config
      );
      return response.data;
    } catch (error) {
      LOG.error(`DELETE request failed: ${url}`, error);
      throw error;
    }
  }
}
