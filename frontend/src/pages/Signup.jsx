import useField from "../hooks/useField";
import useSignup from "../hooks/useSignup";
import { useNavigate } from "react-router-dom";

const ENDPOINT = import.meta.env.VITE_ENDPOINT;

const Signup = () => {
  const navigate = useNavigate();
  const firstname = useField("text");
  const lastname = useField("text");
  const email = useField("email");
  const password = useField("password");
  const teamName = useField("text");

  const { signup, error } = useSignup(`${ENDPOINT}/users/register`);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    //userData contains email and token
    const userData = await signup({
      firstname: firstname.value,
      lastname: lastname.value,
      email: email.value,
      password: password.value,
      teamName: teamName.value,
    });

    if (userData) {
      console.log("success", userData);
      navigate("/"); // Redirect to home or desired page
    } else {
      console.error("Signup failed:", error);
    }
  };

  return (
    <div className="create">
      <h2>Sign Up</h2>
      <form onSubmit={handleFormSubmit}>
        <label>First name:</label>
        <input {...firstname} />
        <label>Last name:</label>
        <input {...lastname} />
        <label>Email address:</label>
        <input {...email} />
        <label>Password:</label>
        <input {...password} />
        <label>Team name:</label>
        <input {...teamName} />
        <button>Sign up</button>
      </form>
    </div>
  );
};

export default Signup;
