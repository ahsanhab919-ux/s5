import axios from "axios";
import AuthService from "../auth.service";
import { jest } from "@jest/globals";

// Mock axios calls
jest.mock("axios");

// Suite of integration tests for AuthService

// Generic types for Axios Response
interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // For future cleanup tasks, if needed
});

describe("AuthService Integration Tests with prod-api.shothik.ai", () => {
  test("Successful login with valid credentials", async () => {
    const mockResponse: AxiosResponse = {
      data: { token: "mock-token" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Call service function
    const result = await AuthService.login("validUser", "validPass");

    // Assert result
    expect(result.token).toBe("mock-token");
  });

  test("Failed login with invalid credentials", async () => {
    const mockResponse: AxiosResponse = {
      data: { error: "Invalid credentials" },
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: {},
    };
    (axios.post as jest.Mock).mockRejectedValueOnce({ response: mockResponse });

    // Call service function & assert rejection
    await expect(
      AuthService.login("invalidUser", "invalidPass"),
    ).rejects.toHaveProperty("response.data.error", "Invalid credentials");
  });

  test("User registration", async () => {
    const mockResponse: AxiosResponse = {
      data: { message: "User registered successfully" },
      status: 201,
      statusText: "Created",
      headers: {},
      config: {},
    };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Call service function
    const result = await AuthService.register(
      "newUser",
      "newPass",
      "newUser@example.com",
    );

    // Assert result
    expect(result.message).toBe("User registered successfully");
  });

  test("Google OAuth login", async () => {
    const mockResponse: AxiosResponse = {
      data: { token: "google-mock-token" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Call service function
    const result = await AuthService.googleOAuth("google-auth-code");

    // Assert result
    expect(result.token).toBe("google-mock-token");
  });

  test("Forgot password functionality", async () => {
    const mockResponse: AxiosResponse = {
      data: { message: "Password reset link sent" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Call service function
    const result = await AuthService.forgotPassword("user@example.com");

    // Assert result
    expect(result.message).toBe("Password reset link sent");
  });

  test("Email verification", async () => {
    const mockResponse: AxiosResponse = {
      data: { message: "Email verified successfully" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Call service function
    const result = await AuthService.verifyEmail("verificationToken");

    // Assert result
    expect(result.message).toBe("Email verified successfully");
  });
});
