export interface SessionTheme {
  bg: string;
  text: string;
  button: string;
  buttonSecondary: string;
  ring: string;
  border: string;
  mini: string;
}

const workTheme: SessionTheme = {
  bg: "from-indigo-50 to-blue-50",
  text: "text-indigo-600",
  button: "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200",
  buttonSecondary: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
  ring: "focus:ring-indigo-200",
  border: "border-indigo-100",
  mini: "bg-indigo-50/90 text-indigo-600 border-indigo-200/50 shadow-indigo-100/50",
};

const breakTheme: SessionTheme = {
  bg: "from-teal-50 to-emerald-50",
  text: "text-teal-600",
  button: "bg-teal-500 hover:bg-teal-600 shadow-teal-200",
  buttonSecondary: "bg-teal-100 text-teal-700 hover:bg-teal-200",
  ring: "focus:ring-teal-200",
  border: "border-teal-100",
  mini: "bg-teal-50/90 text-teal-600 border-teal-200/50 shadow-teal-100/50",
};

export function getTheme(isWorkSession: boolean): SessionTheme {
  return isWorkSession ? workTheme : breakTheme;
}
