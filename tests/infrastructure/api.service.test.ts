import axios from "axios";
import { ApiService } from "../../src/infrastructure/services/api.service";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("ApiService", () => {
  let apiService: ApiService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    // Mock axios.create to return our mock instance
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Create the service
    apiService = new ApiService();
  });

  describe("constructor", () => {
    it("should create an axios instance with default configuration", () => {
      // Assert
      expect(mockedAxios.create).toHaveBeenCalledWith({
        timeout: 10000,
        headers: {},
      });
    });

    it("should set up response interceptors", () => {
      // Assert
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe("get", () => {
    it("should make a GET request and return the response data", async () => {
      // Arrange
      const url = "https://api.example.com/data";
      const config = { headers: { "Custom-Header": "value" } };
      const mockResponse = {
        data: { id: 1, name: "Test" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await apiService.get(url, config);

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(url, config);
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw an error if the request fails", async () => {
      // Arrange
      const url = "https://api.example.com/data";
      const error = new Error("Network error");

      mockAxiosInstance.get.mockRejectedValue(error);

      // Act & Assert
      await expect(apiService.get(url)).rejects.toThrow(error);
    });
  });

  describe("post", () => {
    it("should make a POST request and return the response data", async () => {
      // Arrange
      const url = "https://api.example.com/data";
      const data = { name: "Test" };
      const config = { headers: { "Custom-Header": "value" } };
      const mockResponse = {
        data: { id: 1, name: "Test" },
        status: 201,
        statusText: "Created",
        headers: {},
        config: {},
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiService.post(url, data, config);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(url, data, config);
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw an error if the request fails", async () => {
      // Arrange
      const url = "https://api.example.com/data";
      const data = { name: "Test" };
      const error = new Error("Network error");

      mockAxiosInstance.post.mockRejectedValue(error);

      // Act & Assert
      await expect(apiService.post(url, data)).rejects.toThrow(error);
    });
  });

  describe("put", () => {
    it("should make a PUT request and return the response data", async () => {
      // Arrange
      const url = "https://api.example.com/data/1";
      const data = { name: "Updated Test" };
      const config = { headers: { "Custom-Header": "value" } };
      const mockResponse = {
        data: { id: 1, name: "Updated Test" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };

      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      // Act
      const result = await apiService.put(url, data, config);

      // Assert
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(url, data, config);
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw an error if the request fails", async () => {
      // Arrange
      const url = "https://api.example.com/data/1";
      const data = { name: "Updated Test" };
      const error = new Error("Network error");

      mockAxiosInstance.put.mockRejectedValue(error);

      // Act & Assert
      await expect(apiService.put(url, data)).rejects.toThrow(error);
    });
  });

  describe("delete", () => {
    it("should make a DELETE request and return the response data", async () => {
      // Arrange
      const url = "https://api.example.com/data/1";
      const config = { headers: { "Custom-Header": "value" } };
      const mockResponse = {
        data: { success: true },
        status: 204,
        statusText: "No Content",
        headers: {},
        config: {},
      };

      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      // Act
      const result = await apiService.delete(url, config);

      // Assert
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(url, config);
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw an error if the request fails", async () => {
      // Arrange
      const url = "https://api.example.com/data/1";
      const error = new Error("Network error");

      mockAxiosInstance.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(apiService.delete(url)).rejects.toThrow(error);
    });
  });
});
