import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

export const JsonFormatter = ({ jsonString }) => {
  function replaceWithBr(str) {
    return str.replace(/\\n/g, "\n");
  }

  let formattedJson;
  try {
    let jsonObj = JSON.parse(jsonString);
    formattedJson = JSON.stringify(jsonObj, null, 2); // Format with 2 spaces indentation
    formattedJson = replaceWithBr(formattedJson);
  } catch (error) {
    formattedJson = "Invalid JSON string";
  }

  return (
    <SyntaxHighlighter
      language="javascript"
      style={dracula}
      className="max-h-96 max-w-96 overflow-scroll scrollbar scrollbar-thumb-[#4696ce] scrollbar-track-[#282a36]"
      customStyle={{ paddingRight: "40px" }}
    >
      {formattedJson}
    </SyntaxHighlighter>
  );
};
