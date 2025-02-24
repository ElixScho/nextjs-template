import path from "path";
import fs from "fs";
import chalk from "chalk";
import type { SetupModule } from "./types";

const toasterModule: SetupModule = {
    name: "useToaster",
    question: {
        type: "confirm",
        message: "🍞 Do you want to add react-hot-toast for notifications?",
        default: true,
    },
    setup: async context => {
        console.log(chalk.yellow("Adding react-hot-toast..."));
        if (await context.execCommand("npm install react-hot-toast")) {
            // Create toast provider component
            const toastProvider = `
import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 5000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      }}
    />
  );
}
`;
            fs.writeFileSync(
                path.join(
                    context.projectPath,
                    "components",
                    "ToastProvider.tsx"
                ),
                toastProvider
            );

            // Update root layout with ToastProvider
            context.updateRootLayout({
                projectPath: context.projectPath,
                importStatement: `import { ToastProvider } from "@/components/ToastProvider";\n`,
                providerComponent: "<ToastProvider />",
            });
        }
    },
};

export default toasterModule;
