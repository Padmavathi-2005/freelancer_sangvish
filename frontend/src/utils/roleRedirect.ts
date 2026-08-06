import { API_URL } from "@/config/api";

export interface RoleCheckResult {
  isLoggedIn: boolean;
  isApproved: boolean;
  targetUrl: string;
}

/**
 * Checks the user's role and vetting approval status, switches the active role if necessary,
 * and returns the correct redirection URL.
 * 
 * @param targetRole "client" or "freelancer"
 * @param defaultSuccessUrl The page to send the user if they are approved for the target role
 */
export async function checkAndSwitchRole(
  targetRole: "client" | "freelancer",
  defaultSuccessUrl: string,
  shouldRedirectIfUnapproved: boolean = true
): Promise<RoleCheckResult> {
  if (typeof window === "undefined") {
    return { isLoggedIn: false, isApproved: false, targetUrl: "/login" };
  }

  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  // 1. If not logged in: redirect to login page with redirect param
  if (!token || !user) {
    return {
      isLoggedIn: false,
      isApproved: false,
      targetUrl: `/login?redirect=${encodeURIComponent(defaultSuccessUrl)}`
    };
  }

  try {
    // 2. Query the onboarding-check endpoint to get latest vetting status
    const checkRes = await fetch(`${API_URL}/users/onboarding-check`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!checkRes.ok) {
      // Fallback if API fails: proceed to default success url
      return { isLoggedIn: true, isApproved: false, targetUrl: defaultSuccessUrl };
    }

    const data = await checkRes.json();
    const hasFreelancerProfile = !!data.hasFreelancerProfile;
    const hasClientProfile = !!data.hasClientProfile;
    const freelancerVettingStatus = data.freelancerVettingStatus;
    const clientVettingStatus = data.clientVettingStatus;

    if (targetRole === "client") {
      // Switch onboarding role to client
      localStorage.setItem("onboarding_role", "client");
      const isApproved = hasClientProfile && clientVettingStatus === "Approved";

      if (isApproved) {
        localStorage.setItem("onboarding_completed", "true");
        localStorage.setItem("vetting_status", "Approved");
        return { isLoggedIn: true, isApproved: true, targetUrl: defaultSuccessUrl };
      } else {
        localStorage.setItem("onboarding_completed", "false");
        localStorage.setItem("vetting_status", clientVettingStatus || "Pending");
        return { 
          isLoggedIn: true, 
          isApproved: false, 
          targetUrl: shouldRedirectIfUnapproved ? "/dashboard" : defaultSuccessUrl 
        };
      }
    } else {
      // Switch onboarding role to freelancer
      localStorage.setItem("onboarding_role", "freelancer");
      const isApproved = hasFreelancerProfile && freelancerVettingStatus === "Approved";

      if (isApproved) {
        localStorage.setItem("onboarding_completed", "true");
        localStorage.setItem("vetting_status", "Approved");
        return { isLoggedIn: true, isApproved: true, targetUrl: defaultSuccessUrl };
      } else {
        localStorage.setItem("onboarding_completed", "false");
        localStorage.setItem("vetting_status", freelancerVettingStatus || "Pending");
        return { 
          isLoggedIn: true, 
          isApproved: false, 
          targetUrl: shouldRedirectIfUnapproved ? "/dashboard" : defaultSuccessUrl 
        };
      }
    }
  } catch (err) {
    console.error("Error during checkAndSwitchRole:", err);
    // Fallback: proceed to default success url
    return { isLoggedIn: true, isApproved: false, targetUrl: defaultSuccessUrl };
  }
}
