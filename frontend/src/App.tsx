import { useState } from "react";

const App = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const handleFileChange = (e: any) => {
    setFile(e.target.files[0]);
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload a file");
      return;
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <input
          type="file"
          onChange={handleFileChange}
          accept="application/pdf"
        />
        <button type="submit">Create Project</button>
      </form>
    </div>
  );
};

export default App;
