import type { LoginRequest, LoginResponse, User } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_KEY_BACK_END || "";

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const loginData: LoginRequest = { email, password };

  try {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw new Error(
      "Failed to login. Please check your credentials and try again.",
    );
  }
}

export async function getCurrentUser(): Promise<User | null> {
  return null;
}
