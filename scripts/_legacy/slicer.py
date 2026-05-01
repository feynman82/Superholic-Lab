import sys
import fitz
import os

def slice_pdf(pdf_path, output_dir):
    try:
        doc = fitz.open(pdf_path)
        # 2.0 scale gives high-res PNGs for sharp cropping and OCR
        matrix = fitz.Matrix(2.0, 2.0) 
        for i in range(len(doc)):
            page = doc.load_page(i)
            pix = page.get_pixmap(matrix=matrix)
            out_path = os.path.join(output_dir, f"page_{i}.png")
            pix.save(out_path)
        print(len(doc))
    except Exception as e:
        print("0")

if __name__ == "__main__":
    slice_pdf(sys.argv[1], sys.argv[2])