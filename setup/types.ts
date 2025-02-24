export interface SetupAnswers {
    useStripe: boolean;
    useToaster: boolean;
    useShadcn: boolean;
    usePrisma: boolean;
    addAuth: boolean;
    useStorybook: boolean;
}

export interface SetupContext {
    projectPath: string;
    execCommand: (command: string, interactive?: boolean) => Promise<boolean>;
    ensureDirectoryExists: (dirPath: string) => void;
    updateEnvFile: (
        newVariables: Record<string, string>,
        description?: string
    ) => void;
    updateRootLayout: (options: {
        projectPath: string;
        importStatement: string;
        providerComponent: string;
    }) => void;
}

export interface SetupModule {
    name: string;
    question: {
        type: "confirm";
        message: string;
        default: boolean;
    };
    setup: (context: SetupContext) => Promise<void>;
}
