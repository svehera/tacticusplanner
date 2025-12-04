import React, { useState } from 'react';

export const SupportSection: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const referralCode = 'DUG-38-VAT';
    const coffeeLink = 'https://buymeacoffee.com/tacticusplanner';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="w-full p-6 rounded-2xl bg-white dark:bg-gray-800 border-pink-400 dark:border-pink-500/50 shadow-lg border-2 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col space-y-3 max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    Support Tacticus Planner
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 text-pink-500">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.75 3c1.99 0 3.751 1.08 4.75 2.735a5.375 5.375 0 014.75-2.735c3.036 0 5.5 2.322 5.5 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.47 0l-.003-.001z" />
                    </svg>
                </h2>
                <p className="text-gray-600 dark:text-gray-300">Found this helpful? Use refer-a-friend code:</p>

                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 border rounded-lg p-1 pl-4 w-full max-w-xs shadow-sm">
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-100 tracking-wider select-all">
                        {referralCode}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none"
                        title="Copy to clipboard">
                        {copied ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5 text-green-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <div>
                <a
                    href={coffeeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200 group">
                    <div className="w-10 h-10 flex-shrink-0 relative">
                        <svg
                            viewBox="0 0 32 32"
                            className="w-full h-full"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 24H23" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
                            <path
                                d="M23 24C23 24 25 24 26 23C27 22 28 20 28 18C28 16 27 14 26 13C25 12 23 12 23 12V24Z"
                                stroke="#4B5563"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M6 4H23C23 4 23 6 23 12C23 18 23 24 23 24H9C9 24 9 18 9 12C9 6 9 4 6 4Z"
                                fill="white"
                                stroke="#4B5563"
                                strokeWidth="2"
                                strokeLinejoin="round"
                                className="dark:fill-gray-800"
                            />
                            <path
                                d="M9 12C9 12 9 14 10 16C11 18 13 19 16 19C19 19 21 18 22 16C23 14 23 12 23 12H9Z"
                                fill="#FBBF24"
                            />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Buy me a coffee
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">buymeacoffee.com</span>
                    </div>
                </a>
            </div>
        </div>
    );
};
