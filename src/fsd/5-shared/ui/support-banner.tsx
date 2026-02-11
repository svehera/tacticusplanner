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
        <div className="flex w-full flex-col items-center justify-between gap-6 rounded-2xl border-2 border-pink-400 bg-white p-6 shadow-lg md:flex-row dark:border-pink-500/50 dark:bg-gray-800">
            <div className="flex max-w-md flex-col space-y-3">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Support Tacticus Planner
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-6 w-6 text-pink-500">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.75 3c1.99 0 3.751 1.08 4.75 2.735a5.375 5.375 0 014.75-2.735c3.036 0 5.5 2.322 5.5 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.47 0l-.003-.001z" />
                    </svg>
                </h2>
                <p className="text-gray-600 dark:text-gray-300">Found this helpful? Use refer-a-friend code:</p>

                <div className="flex w-full max-w-xs items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-1 pl-4 shadow-sm dark:border-gray-600 dark:bg-gray-700">
                    <span className="font-mono font-bold tracking-wider text-gray-800 select-all dark:text-gray-100">
                        {referralCode}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 focus:outline-none dark:hover:bg-gray-600"
                        title="Copy to clipboard">
                        {copied ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="h-5 w-5 text-green-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="h-5 w-5">
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
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-600 dark:bg-gray-700">
                    <div className="relative h-10 w-10 flex-shrink-0">
                        <svg
                            viewBox="0 0 32 32"
                            className="h-full w-full"
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
                        <span className="font-bold text-gray-800 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                            Buy me a coffee
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">buymeacoffee.com</span>
                    </div>
                </a>
            </div>
        </div>
    );
};
