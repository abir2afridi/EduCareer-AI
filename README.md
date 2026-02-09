# EduCareer AI - Complete Education & Career Management Platform

A comprehensive educational platform that combines learning management, career guidance, AI-powered assistance, and administrative tools in one unified ecosystem.

## 🎯 Key Features

### For Students
- **Dashboard**: Personalized learning hub with progress tracking
- **Courses**: Interactive course management with completion tracking
- **Career Guidance**: AI-powered career assessment and guidance
- **AI Assistant**: Gemini-powered educational assistant (via Supabase Edge Functions)
- **Assessments**: Quizzes and evaluations with instant feedback
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
- **Google Gemini AI** for educational assistance
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

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/EduCareer-AI.git
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
4. Configure `firebase.js` with your project credentials

### Supabase AI Setup
1. Create a Supabase project
2. Follow the [GEMINI_SETUP.md](./GEMINI_SETUP.md) guide
3. Deploy the AI chat Edge Function:
   ```bash
   supabase functions deploy ai-chat
   ```

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
```

## 🎨 UI/UX Features

- **Material Design 3** inspired interface
- **Dark/Light theme** support
- **Responsive design** for all devices
- **Real-time updates** with live data
- **Smooth animations** and micro-interactions
- **Accessibility** compliance

## 🔐 Security Features

- **Firebase Authentication** with email/password
- **Role-based access control** (Student/Admin)
- **Protected routes** and API endpoints
- **Secure file uploads** with Firebase Storage
- **Environment variable** protection

## 📊 Key Integrations

- **Google Gemini AI**: Educational assistance and tutoring
- **Firebase**: Real-time database and authentication
- **Supabase**: Edge functions for AI processing
- **Firebase Storage**: File and media management

## 🌟 Highlights

- **AI-Powered Learning**: Gemini integration for personalized education
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
- Review the [AI setup guide](./GEMINI_SETUP.md)

---

**EduCareer AI** - Empowering education through technology and AI
