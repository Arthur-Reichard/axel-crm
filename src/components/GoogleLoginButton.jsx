import googleLogo from "../pages/Images/Googleicon.svg";

export default function GoogleLoginButton() {
    const clientId = "423050071002-sji7iv52o72oqg9j385a9diajsf17m1v.apps.googleusercontent.com";
    const redirectUri = "http://localhost:8888/axel-crm/oauth/callback";
    const scopes = encodeURIComponent("https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email");
  
    const handleLogin = () => {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&access_type=offline&prompt=consent`;
      window.location.href = authUrl;
    };

    return (
      <button type="button" className="social-button google" onClick={handleLogin}>
        <img src={googleLogo} alt="Google" className="social-icon" />
        Se connecter avec Google
      </button>
    );
  }  