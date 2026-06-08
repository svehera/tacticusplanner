const homeQuestionnaireDismissedStorageKey = 'home-questionnaire-dismissed:DALZmXTXTwLUuZuM7';

export const homeQuestionnaireLink = 'https://forms.gle/DALZmXTXTwLUuZuM7';

export function isHomeQuestionnaireDismissed(): boolean {
    return localStorage.getItem(homeQuestionnaireDismissedStorageKey) === 'true';
}

export function dismissHomeQuestionnaire(): void {
    localStorage.setItem(homeQuestionnaireDismissedStorageKey, 'true');
}
