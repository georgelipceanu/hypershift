from fastapi import FastAPI
from pydantic import BaseModel
from nbclient.client import NotebookClient
from nbformat import read, write, v4
import nbformat
import copy
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    question: str

original_nb = None

@app.on_event("startup")
async def initialize_notebook():
    global original_nb

    with open("data-ingestion.ipynb") as f:
        nb = nbformat.read(f, as_version=4)

    nb.cells = [cell for cell in nb.cells if cell.source.strip()]

    client = NotebookClient(nb, timeout=60, kernel_name="python3")
    print("Running notebook at startup...")

    try:
        await client.async_execute()
        print("Notebook initialized.")
        original_nb = nb  
    except Exception as e:
        print(f"Notebook failed to initialize: {e}")

@app.post("/query")
async def run_query(query: Query):
    if original_nb is None:
        return {"error": "Notebook not initialized."}

    nb_copy = copy.deepcopy(original_nb)

    nb_copy.cells.append(v4.new_code_cell(f"question = '{query.question}'"))
    nb_copy.cells.append(v4.new_code_cell("answer_query(question)"))

    client = NotebookClient(nb_copy, timeout=30, kernel_name="python3")

    try:
        await client.async_execute()

        last_cell = nb_copy.cells[-1]
        for output in last_cell.get("outputs", []):
            if output.output_type == "execute_result":
                return {"answer": output["data"].get("text/plain", "").strip()}
            elif output.output_type == "stream":
                return {"answer": output.text.strip()}

        return {"answer": "No output from the cell."}

    except Exception as e:
        return {"error": f"Execution failed: {str(e)}"}
