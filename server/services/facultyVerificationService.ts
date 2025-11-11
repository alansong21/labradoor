export type FacultyLookupParams = {
    department: "COMPUTER_SCIENCE";
    firstName: string;
    lastName: string;
};

export async function fetchFacultyEmail(_params: FacultyLookupParams): Promise<string> {
    throw new Error("fetchFacultyEmail not implemented");
}