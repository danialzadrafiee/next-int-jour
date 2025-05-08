
interface BaseFieldConfig {
    id: string;
    label: string;
    type: string;
    placeholder?: string;
    colSpan?: number;
}

interface InputFieldConfig extends BaseFieldConfig {
    type: 'input';
}

interface WysiwygFieldConfig extends BaseFieldConfig {
    type: 'wysiwyg';
}

interface CheckboxFieldConfig extends BaseFieldConfig {
    type: 'checkbox';
}

export interface SliderFieldConfig extends BaseFieldConfig {
    type: 'slider';
    min: number;
    max: number;
    step: number;
    initialValue: number;
    suffix: string;
}

type FieldConfig = InputFieldConfig | WysiwygFieldConfig | CheckboxFieldConfig | SliderFieldConfig;
interface SectionConfig {
    section: string;
    icon: string;
    fields: FieldConfig[];
}


// Define the configuration for each form field

export const formConfig: SectionConfig[] = [
    {
        section: "Pre-Market Prep",
        icon: "🧠",
        fields: [

            {
                id: "trcGoal",
                label: "TRC Goal",
                type: "input",
                placeholder: "e.g., Execute plan flawlessly, manage risk",
                colSpan: 2,
            },
            {
                id: "trcPlan",
                label: "Plan to Achieve TRC Goal",
                type: "wysiwyg",
                placeholder: "How will you achieve the goal?",
                colSpan: 2,
            },
            {
                id: "emotionalTemp",
                label: "Emotional Temperature",
                type: "slider",
                min: 1,
                max: 10,
                step: 1,
                initialValue: 5,
                suffix: "/10",
            },
            {
                id: "emotionalReason",
                label: "Reason for Emotional State",
                type: "wysiwyg",
                placeholder: "Feeling calm and focused because...",
            },
            {
                id: "aphorisms",
                label: "Reminders / aphorisms to self",
                type: "input",
                placeholder: "e.g., Stick to the plan, don't chase",
                colSpan: 2,
            },
    
        ],
    },
    {
        section: "Post-Market Review",
        icon: "📊",
        fields: [
            {
                id: "loggedInStats",
                label: "Logged Stats?",
                type: "checkbox",
            },
            {
                id: "brokeRules",
                label: "Broke Any Rules?",
                type: "checkbox",
            },
            {
                id: "rulesExplanation",
                label: "What rule did you break and why?",
                type: "wysiwyg",
                placeholder: "Explanation of rule breaking (if applicable)",
                colSpan: 2,
            },
            {
                id: "trcProgress",
                label: "Made progress toward TRC?",
                type: "checkbox",
            },
            {
                id: "whyTrcProgress",
                label: "Why / Why Not  made progress toward trc?",
                type: "wysiwyg",
                placeholder: "Explanation of TRC progress",
                colSpan: 2,
            },
            {
                id: "pnlOfTheDay",
                label: "P&L Summary",
                type: "wysiwyg",
                placeholder: "Summary of profit/loss for the day",
                colSpan: 2,
            },
        ],
    },
    {
        section: "Learnings & Improvements",
        icon: "📚",
        fields: [
            {
                id: "learnings",
                label: "What did i learn/improve today(market+self)",
                type: "wysiwyg",
                placeholder: "What did you learn today?",
            },
            {
                id: "whatIsntWorking",
                label: "What Isn't Working",
                type: "wysiwyg",
                placeholder: "Aspects of your trading that aren't working",
            },
            {
                id: "eliminationPlan",
                label: "What will i eliminate starting now?",
                type: "wysiwyg",
                placeholder: "What should be eliminated from your process?",
            },
            {
                id: "changePlan",
                label: "What changes can be made in order to achieve my goal?",
                type: "wysiwyg",
                placeholder: "What changes can help achieve your goals?",
            },
            {
                id: "solutionBrainstorm",
                label: "For the changes i need to make starting today, what are the solutions i can find?",
                type: "wysiwyg",
                placeholder: "Brainstorm solutions for problems identified",
            },
            {
                id: "adjustmentForTomorrow",
                label: "What adjustments will i make for tomorrow?",
                type: "wysiwyg",
                placeholder: "What adjustments will you make tomorrow?",
            },

        ],
    },
    {
        section: "Strategic",
        icon: "🎯",
        fields: [
            {
                id: "top3ThingsDoneWell",
                label: "Top 3 things done well today",
                type: "wysiwyg",
                placeholder: "What were the top 3 things you did well today?",
            },
            {
                id: "top3MistakesToday",
                label: "Top 3 mistakes of today",
                type: "wysiwyg",
                placeholder: "What were your Top 3 mistakes of today?",
            },
            {
                id: "bestAndWorstTrades",
                label: "What was the best and worst trade today?",
                type: "wysiwyg",
                placeholder: "What were your What was the best and worst trade today? today?",
            },
            {
                id: "recurringMistake",
                label: "What recurring mistake am i still making, and what's the real root cause?",
                type: "wysiwyg",
                placeholder: "Is there a What recurring mistake am i still making, and what's the real root cause? you're seeing?",
            },
            {
                id: "oneTakeawayTeaching",
                label: "If i had to teach one takeaway from todays trades to a junior trader what would it be?",
                type: "wysiwyg",
                placeholder: "If you had to teach one takeaway from today, what would it be?",
            },
            {
                id: "todaysRepetition",
                label: "If today repeated 10 more times, what would i change to maximize edge?",
                type: "wysiwyg",
                placeholder: "If today repeated 10 times, what would you change for edge?",
            },
            {
                id: "actionsToImproveForward",
                label: "List of actions to improve forward.",
                type: "wysiwyg",
                placeholder: "What specific actions will improve your trading going forward?",
            },
        ],
    },
];