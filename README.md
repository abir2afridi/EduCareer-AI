# EduCareer AI - Complete Education & Career Management Platform

A comprehensive educational platform that combines learning management, career guidance, AI-powered assistance, and administrative tools in one unified ecosystem.

## 🎯 Key Features

### For Students
- **Dashboard**: Personalized learning hub with progress tracking
- **Courses**: Interactive course management with completion tracking
- **Career Guidance**: AI-powered career assessment and guidance
- **AI Assistant**: Trinity AI-powered educational assistant (via OpenRouter API & Supabase Edge Functions)
- **AI Quiz**: Dynamic quiz generation with comprehensive subject coverage
- **Image Analysis**: Educational guidance for uploaded images with smart fallback
- **Leaderboard**: Gamified learning with peer competition
- **Messaging**: Real-time chat with friends and teachers
- **Email System**: Integrated communication platform

### For Administrators
- **Admin Dashboard**: Complete system oversight
- **Student Management**: Comprehensive student data management
- **Teacher Management**: Faculty administration and scheduling
- **Course Management**: Curriculum creation and management
- **Payment Processing**: Financial transaction tracking
- **Analytics & Reports**: Data-driven insights and reporting
- **System Settings**: Platform configuration and control

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Router** for navigation
- **TanStack Query** for state management
- **Framer Motion** for animations

### Backend & Services
- **Firebase** (Authentication, Firestore Database, Storage)
- **Supabase** (Edge Functions for AI integration)
- **OpenRouter Trinity AI** for educational assistance
- **Firebase Admin SDK** for server-side operations

### Development Tools
- **ESLint** for code quality
- **TypeScript** for type safety
- **PostCSS** for CSS processing

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase project setup
- Supabase project setup (for AI features)
- OpenRouter API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abir2afridi/EduCareer-AI.git
   cd EduCareer-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Configure Firebase credentials
   - Set up Supabase for AI features
   - Configure OpenRouter API key

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication, Firestore, and Storage
3. Download service account key
4. Configure environment variables in `.env.local`:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   ```

### Supabase AI Setup
1. Create a Supabase project
2. Set OpenRouter API key as Supabase secret:
   ```bash
   supabase secrets set OPENROUTER_API_KEY=your_openrouter_key
   ```
3. Deploy the AI Edge Functions:
   ```bash
   supabase functions deploy ai-chat
   supabase functions deploy ai-chat-simple
   ```

### OpenRouter Setup
1. Create an account at [OpenRouter](https://openrouter.ai/)
2. Get your API key
3. Set it as a Supabase secret for edge functions

## 📁 Project Structure

```bash
src/
├── components/          # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   ├── admin/         # Admin-specific components
│   └── chat/          # Chat and messaging components
├── pages/             # Page components
│   ├── admin/         # Admin dashboard pages
│   ├── career-guidance/ # Career assessment pages
│   └── student/       # Student-specific pages
├── hooks/             # Custom React hooks
├── context/           # React context providers
├── constants/         # App constants and configurations
└── layouts/           # Layout components

supabase/
└── functions/         # Supabase Edge Functions
    ├── ai-chat/       # Main AI chat function
    └── ai-chat-simple/ # Simplified AI with image fallback
```

## 🎨 UI/UX Features

- **Material Design 3** inspired interface
- **Dark/Light theme** support
- **Responsive design** for all devices
- **Real-time updates** with live data
- **Smooth animations** and micro-interactions
- **Accessibility** compliance

## 🔐 Security Features

- **Firebase Authentication** with email/password and Google Sign-In
- **Role-based access control** (Student/Admin)
- **Protected routes** and API endpoints
- **Secure file uploads** with Firebase Storage
- **Environment variable** protection with CORS configuration
- **API key security** with proper secret management

## 📊 Key Integrations

- **OpenRouter Trinity AI**: Advanced educational assistance and tutoring
- **Firebase**: Real-time database and authentication
- **Supabase**: Edge functions for AI processing
- **Firebase Storage**: File and media management

## 🤖 AI Features

### AI Assistant
- **Bangladeshi Context**: Trained specifically for Bangladeshi education system
- **Subject Expertise**: Mathematics, Science, Computer Science, Business, Humanities
- **Career Guidance**: University admissions, job market insights, scholarships
- **Study Strategies**: Exam preparation, time management, research methods
- **Developer Info**: Responds with "Name: Abir Hasan Siam | GitHub: github.com/abir2afridi"

### AI Quiz
- **Dynamic Generation**: Creates comprehensive quizzes on any subject
- **Multi-Subject Support**: Mathematics, Science, Computer Science, etc.
- **Complete Answers**: All questions include detailed solutions
- **Educational Structure**: Organized by difficulty and topic

### Image Analysis
- **Smart Fallback**: Provides educational guidance when image processing isn't available
- **Helpful Responses**: Asks users to describe images for manual analysis
- **Educational Focus**: Tailored for diagrams, formulas, and study materials

## 🌟 Highlights

- **AI-Powered Learning**: Trinity AI integration for personalized education
- **Bangladeshi Context**: Localized for SSC, HSC, and university systems
- **Comprehensive Dashboard**: 360° view of student progress
- **Career Assessment**: Advanced career guidance algorithms
- **Real-time Communication**: Chat and email systems
- **Admin Analytics**: Detailed reporting and insights
- **Mobile Responsive**: Works seamlessly on all devices

## 📈 Performance

- **Optimized builds** with Vite
- **Lazy loading** for better performance
- **Efficient state management** with TanStack Query
- **Code splitting** for faster initial loads
- **Edge Functions**: Fast AI responses via Supabase

## 🚀 Deployment

### Development
```bash
npm run dev
# Runs on http://localhost:8081
```

### Production
- **Vercel**: https://educareer-ai.vercel.app
- **Environment Variables**: Configured for production
- **Edge Functions**: Deployed and ready
- **CORS**: Properly configured for cross-origin requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [documentation](./docs/)
- Review the security and deployment guides

---

**EduCareer AI** - Empowering education through technology and AI

*Developed by Abir Hasan Siam | [GitHub](https://github.com/abir2afridi)*
