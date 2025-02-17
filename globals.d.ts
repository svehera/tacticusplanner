interface BeforeInstallPromptEvent extends Event {
    readonly platform: string; // The platform (e.g., 'android', 'windows')
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'; // Whether the user accepted or dismissed the installation prompt
        platform: string; // The platform on which the prompt was triggered
    }>;
    prompt: () => Promise<void>; // Function to trigger the install prompt
}
