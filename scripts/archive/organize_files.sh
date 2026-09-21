#!/bin/bash
cd /app/applet

# Move Layouts
mv src/components/Header.jsx src/presentation/components/layout/ 2>/dev/null
mv src/components/Sidebar.jsx src/presentation/components/layout/ 2>/dev/null

# Move Modals
mv src/components/AddArticleModal.jsx src/presentation/components/modals/ 2>/dev/null
mv src/components/AddMachineModal.jsx src/presentation/components/modals/ 2>/dev/null
mv src/components/AddUserModal.jsx src/presentation/components/modals/ 2>/dev/null
mv src/components/AddZoneModal.jsx src/presentation/components/modals/ 2>/dev/null
mv src/components/EditArticleModal.jsx src/presentation/components/modals/ 2>/dev/null
mv src/components/QuickMovementModal.jsx src/presentation/components/modals/ 2>/dev/null

# Move Pages (Views)
mv src/components/*View.jsx src/presentation/pages/ 2>/dev/null
mv src/components/LoginScreen.jsx src/presentation/pages/ 2>/dev/null
mv src/components/SplashScreen.jsx src/presentation/pages/ 2>/dev/null

# Move Common Components (everything else left in components that is .jsx)
mv src/components/*.jsx src/presentation/components/common/ 2>/dev/null
mv src/components/icons src/presentation/components/common/ 2>/dev/null

echo "Files moved successfully."
