import '../styles/LoginPage.css'
import LoginForm from '../components/auth/LoginForm'

const LoginPage = () => {
  return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-info">
            <h1>ยินดีต้อนรับกลับสู่</h1>
            <h1>เว็บไซต์ Lotterich</h1>
            <p></p>
          </div>
          <div className="login-form">
            <LoginForm />
          </div>
        </div>
      </div>
  )
}

export default LoginPage