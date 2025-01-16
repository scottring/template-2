# 🚀 Conductor App Cheat Sheet

## 📁 Environment Setup
Environment files control your app's behavior in different contexts (local development, staging, production).
Each file contains sensitive configuration data like API keys and project settings.

```bash
.env.local        # Your personal development settings (never commit this!)
.env.development  # Team-wide development settings
.env.production   # Live production settings
```

💡 **Important**: 
- Never commit `.env.local` or actual API keys to Git!
- Browser tab shows "SymphGoal-Dev" in development and "SymphGoal-Prod" in production to easily identify which environment you're in

## 🛠️ Development Commands

### Local Development
These commands are your daily drivers for development work:

```bash
# Start your local development server (http://localhost:3000)
npm run dev

# Start fresh (clears database) - useful when things get weird
npm run dev:fresh

# Check your code for potential errors
npm run lint

# Verify all TypeScript types are correct
npm run type-check

# Create an optimized production build
npm run build
```

💡 **Tip**: Always run `npm run lint` before committing code to catch common issues early.

### 🧪 Testing
Regular testing helps catch bugs before they reach production:

```bash
# Run all tests once
npm run test

# Run tests and re-run when files change (great for TDD)
npm run test:watch
```

## 📦 Deployment

### Production Build & Deploy
When you're ready to show your work to the world:

```bash
# First, create an optimized build
npm run build

# Option 1: Deploy to Vercel (recommended for Next.js apps)
vercel deploy --prod

# Option 2: Deploy to Firebase Hosting
firebase deploy
```

💡 **Best Practice**: Always test your build locally with `npm run build && npm run start` before deploying.

## 🔄 Environment Management

### Switch Environments
Different environments use different settings (API keys, database URLs, etc.):

```bash
# For local development (uses development Firebase project)
NODE_ENV=development npm run dev

# For production builds (uses production Firebase project)
NODE_ENV=production npm run build
```

💡 **Note**: The environment affects which `.env` file is used and how your code behaves.

## 🔥 Firebase Management

### Development Project
Your sandbox for testing and development:
- Project ID: `goalplan`
- Purpose: Safe space for testing and development
- Features enabled:
  - Google Authentication (for user login)
  - Firestore (for storing user data)
- Security: Relaxed rules for easier development

### Production Project
Your live, customer-facing project:
- Project ID: `conductor-app-2024`
- Purpose: Live application for real users
- Features enabled:
  - Google Authentication
  - Firestore
- Security: Strict rules to protect user data

### Firebase Commands
Common Firebase management tasks:

```bash
# Update your database security rules
firebase deploy --only firestore:rules

# Deploy backend functions
firebase deploy --only functions

# Check what's happening with your functions
firebase functions:log
```

💡 **Tip**: Always test security rules in the Firebase Console's Rules Playground before deploying.

## 🔍 Debugging

### Common Issues & Solutions

1. Authentication Problems:
   ```bash
   # If login stops working:
   # 1. Clear your browser data
   # 2. Restart the dev server fresh
   npm run dev:fresh
   ```
   💡 **Common Causes**: Expired tokens, mismatched API keys, wrong Firebase project

2. Firebase Permission Issues:
   - Check Firestore rules in Firebase Console
   - Verify the user is actually logged in
   - Make sure you're using the right environment's API keys
   
   💡 **Quick Test**: Try reading/writing in Firebase Console first

3. Environment Variable Problems:
   ```bash
   # Check which environment you're in
   echo $NODE_ENV
   
   # After changing any .env file:
   # 1. Stop the server (Ctrl+C)
   # 2. Restart it
   npm run dev
   ```
   💡 **Remember**: Environment variables only load on server start!

## 📝 Maintenance Tasks

### Regular Maintenance
Keep your app healthy with these regular checks:

1. Update Dependencies:
   ```bash
   # Check what needs updating
   npm outdated
   
   # Apply safe updates
   npm update
   ```
   💡 **Careful**: Major version updates might break things!

2. Security Checks:
   ```bash
   # Find security issues
   npm audit
   
   # Fix automatic security issues
   npm audit fix
   ```
   💡 **Important**: Review changes before applying fixes

3. Database Maintenance:
   - Export Firestore data monthly (Firebase Console > Export)
   - Check usage against Firebase free tier limits
   - Review security rules every few weeks
   
   💡 **Pro Tip**: Set calendar reminders for these tasks

### Performance Monitoring
Keep your app fast and reliable:

1. Firebase Performance Tab:
   - Check page load times
   - Monitor API response times
   - Track user interactions

2. Vercel Analytics:
   - Watch deployment success rates
   - Monitor Edge Function performance
   - Track Core Web Vitals

3. Error Tracking:
   - Check Firebase Console for crashes
   - Monitor server-side errors in Vercel
   - Review client-side errors in browser console

## 🔐 Security Checklist
Monthly security audit checklist:

- [ ] Review Firestore rules - Are they still appropriate?
- [ ] Check Firebase Authentication settings - Which providers are enabled?
- [ ] Audit environment variables - Any exposed in client-side code?
- [ ] Review API access - Check for unused API keys
- [ ] Scan for exposed secrets in code
- [ ] Review Firebase usage and quotas
- [ ] Check for dependency vulnerabilities
- [ ] Review error logs for security issues

## 📊 Monitoring & Analytics

### Firebase Console
- Real-time user count
- Authentication success rates
- Database usage and costs
- Function execution metrics
- Error rates and types

### Vercel Dashboard
- Deployment history
- Performance metrics
- API route usage
- Edge function performance
- Build logs and errors

### Application Logs
- User session data
- Critical business events
- Error tracking
- Performance bottlenecks
- User behavior patterns

💡 **Pro Tip**: Set up alerts in Firebase and Vercel for critical metrics! 