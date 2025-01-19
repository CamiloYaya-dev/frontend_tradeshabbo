// Define the binary patterns for each letter
const binaryPatterns = {
    "H": ["0011001100", "0011001100", "0011111100", "0011001100", "0011001100"],
    "A": ["001111100", "011000110", "011111110", "011000110", "011000110"],
    "B": ["01111100", "01100110", "01111100", "01100110", "01111100"],
    "O": ["000111000", "011000110", "011000110", "011000110", "000111000"],
};

// Function to print binary text forming the word visually
function printVisualBinaryText(text) {
    // Convert the text to its binary pattern rows
    const binaryRows = text.split("").map(char => binaryPatterns[char.toUpperCase()] || []);

    // Determine the number of rows for the largest letter
    const numRows = binaryRows[0].length;

    // Print row by row, stitching letters horizontally
    for (let row = 0; row < numRows; row++) {
        let line = "";
        binaryRows.forEach(letter => {
            line += (letter[row] || "") + "  "; // Add spacing between letters
        });
        console.log(line);
    }
}

// Call the function with "HABBO"
printVisualBinaryText("HABBO");
