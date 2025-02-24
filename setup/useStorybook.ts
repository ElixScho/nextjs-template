import { SetupModule } from "./types";
import fs from "node:fs";

export const useStorybook: SetupModule = {
    name: "useStorybook",
    question: {
        type: "confirm",
        message:
            "Would you like to add Storybook for component development and testing?",
        default: true,
    },
    setup: async context => {
        const { execCommand, projectPath } = context;

        // Install Storybook and its dependencies
        execCommand("npx storybook@latest init --builder webpack5");

        // Add scripts to package.json (in case they weren't added by the init)
        const packageJson = JSON.parse(
            fs.readFileSync(`${projectPath}/package.json`, "utf-8")
        );
        packageJson.scripts = {
            ...packageJson.scripts,
            storybook: "storybook dev -p 6006",
            "build-storybook": "storybook build",
        };
        fs.writeFileSync(
            `${projectPath}/package.json`,
            JSON.stringify(packageJson, null, 2)
        );
    },
};
