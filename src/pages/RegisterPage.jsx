import '../styles/RegisterPage.css'
import RegisterForm from '../components/auth/RegisterForm'

const RegisterPage = () => {
  return (
    <div className="create-account-container">
      <div className="create-account-card">
      <RegisterForm />
        <div className="create-account-info">
          <h1>ยินดีต้อนรับเข้าสู่</h1>
          <h1>เว็บไซต์ Lotterich</h1>
          <p></p>
        </div>
        <div className="create-account-form-wrapper">
        </div>
      </div>
    </div>
  )
}

export default RegisterPage