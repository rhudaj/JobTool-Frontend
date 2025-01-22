export const jsonFileImport = (
    event: React.ChangeEvent<HTMLInputElement>,
    handleData: (props: {name: string, data: any}) => void) => {

    const file = event.target.files?.[0]; // Get the selected file
    if (!file) return;
    const name = file.name.split(".json")[0]

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const json_str = e.target?.result as string; // File content as text
            const data = JSON.parse(json_str);
            // *** call the callback ***
            handleData({name, data})
        } catch (error) {
            alert("Invalid .json file")
            throw Error(`Error parsing JSON file: ${error}`);
        }
    };

    reader.readAsText(file); // Trigger file reading
};

/** save the object as .json file to the Downloads folder */
export const downloadAsJson = (data: any) => {

    // get the modified cv:
    const jsonString = JSON.stringify(data);

    // Prompt the user to enter a custom filename
    const filename = window.prompt("Enter a filename for your JSON file:", "my_resume");
    if(!filename) return;

    // Create a Blob (file-like object) from the JSON string:
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;  // Use the filename entered by the user
    link.click();  // Trigger the download
};

/* Returns the file the user entered name (if valid, otherwise `null`) */
export const promptFileName = (invalid_fileNames?: string[]): string|null => {
    // Get non-empty user input for CV name
    let cvName: string | null = null;

    while (true) {
        cvName = prompt("Name the file")?.trim();
        // 3 cases
        if (cvName === null) {
            // they clicked cancel
            break;
        } else if (cvName === "") {
            // they clicked ok but didn't enter anything
            cvName = null;
            alert("Input cannot be left blank.");
        } else if (invalid_fileNames?.find(n => n === cvName)) {

            // alert("CV with that name already exists.");
            const isConfirmed = window.confirm(
                "File with that name already exists. Are you okay with it?"
            );

            if (isConfirmed) {
                // User clicked "OK"
                console.log("User is okay with it.");
                break;
            } else {
                // User clicked "Cancel"
                console.log("User is not okay with it.");
                cvName = null;
            }
        } else {
            // they entered a VALID name
            break;
        }
    }

    // !cvname => User cancelled the prompt
    // cvname  => User entered a valid CV name

    return cvName;
};