# AI Assistant for Accountants

A modern, beautifully designed AI-powered assistant specifically built for accountants and tax professionals. This application provides intelligent document analysis, fiscal consultation, and normative research capabilities with a contemporary user interface.

## Features

✨ **Modern UI/UX**
- Clean, intuitive interface with professional design
- Responsive layout that works seamlessly on desktop, tablet, and mobile
- Smooth animations and micro-interactions
- Dark/light mode support

📄 **Document Processing**
- Upload and analyze PDF, Word, Excel, and image documents
- OCR support for scanned documents
- Multi-file handling
- Real-time processing status

💬 **AI-Powered Consultation**
- Real-time streaming responses from Google Gemini
- Context-aware analysis based on uploaded documents
- Quick-answer templates for common questions
- Message summarization
- Source citations and references

🗂️ **Chat Management**
- Multiple concurrent chat sessions
- Search and filter chat history
- Rename conversations
- Quick session switching

## Quick Start

### Prerequisites
- Node.js 16+
- Google Gemini API Key

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   API_KEY=your_gemini_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Architecture

The application follows modern React best practices:

- **Component-based architecture** with modular organization
- **Type-safe development** using TypeScript
- **Efficient state management** with React hooks
- **Responsive design** with Tailwind CSS
- **Accessibility-first** approach with ARIA labels and semantic HTML

## Project Structure

```
src/
├── components/        # Reusable React components
├── services/          # API and business logic
├── utils/             # Utility functions
├── styles/            # Global CSS
├── types.ts           # TypeScript type definitions
├── constants.tsx      # App constants and prompts
└── App.tsx            # Main application component
```

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Gemini API** - AI backend
- **Vite** - Build tool and dev server

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is proprietary and intended for professional use by accounting firms and tax consultants.

---

**Version:** 2.0 | **Last Updated:** 2025
