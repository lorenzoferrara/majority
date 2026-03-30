import pathlib
import sys

def generate_tree(directory, prefix="", ignored_dirs=None, file=None):
    """
    Recursively generates a visual tree and writes it to a file or stdout.
    """
    if ignored_dirs is None:
        ignored_dirs = {".git", "node_modules", "__pycache__", ".venv", ".next"}

    path = pathlib.Path(directory)
    
    # Filter and sort paths
    try:
        paths = [p for p in path.iterdir() if p.name not in ignored_dirs]
        paths.sort(key=lambda x: (x.is_file(), x.name.lower()))
    except PermissionError:
        # Skip directories where access is denied
        return

    for i, item in enumerate(paths):
        is_last = (i == len(paths) - 1)
        connector = "└── " if is_last else "├── "
        
        # Write to the specified file or console
        print(f"{prefix}{connector}{item.name}", file=file)
        
        if item.is_dir():
            extension = "    " if is_last else "│   "
            generate_tree(item, prefix + extension, ignored_dirs, file=file)

def save_tree_to_txt(target_path, output_filename):
    """
    Handles file operations and initiates the tree generation.
    """
    target = pathlib.Path(target_path).resolve()
    
    with open(output_filename, 'w', encoding='utf-8') as f:
        f.write(f"Directory tree for: {target}\n")
        f.write("=" * 50 + "\n")
        generate_tree(target, file=f)
    
    print(f"Tree structure successfully saved to: {output_filename}")

if __name__ == "__main__":
    # Configuration
    TARGET_DIRECTORY = "."
    OUTPUT_FILE = "folder_structure.txt"
    
    save_tree_to_txt(TARGET_DIRECTORY, OUTPUT_FILE)