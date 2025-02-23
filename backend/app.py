from flask import Flask, request, jsonify, render_template, redirect, url_for, send_file
from flask_cors import CORS
import os
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Set the backend to non-interactive
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from tiktokendemo import ttk  # Ensure this script contains ttk function

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for frontend

# Set the folder to store uploaded files
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'conversations')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/report')
def report():
    return render_template('report.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        print("Saving file to", file_path)
        file.save(file_path)
        
        try:
            file_path = os.path.abspath(file_path)
            print("Processing with tiktokendemo.py:", file_path)

            # Call function from tiktokendemo.py
            total_joules, daily, monthly, yearly = ttk(file_path)
            print("Completed tiktoken processing")

            # PDF Report Path
            pdf_filename = os.path.join(app.config['UPLOAD_FOLDER'], 'energy_report.pdf')

            with PdfPages(pdf_filename) as pdf:
                # Page 1: Total Energy Consumption (Text)
                fig_text, ax_text = plt.subplots(figsize=(8, 2))
                ax_text.axis("off")
                ax_text.text(0.1, 0.5, f"Total Energy Consumption: {total_joules} Joules", fontsize=14)
                pdf.savefig(fig_text)
                plt.close(fig_text)

                # Function to generate plots
                def save_plot(df, title):
                    dates = df['date'].astype(str).tolist()
                    energy_costs = df['energy_cost_joules'].tolist()

                    fig, ax = plt.subplots(figsize=(10, 8))
                    ax.plot(dates, energy_costs, marker='o', linestyle='-', color='red')
                    plt.xlabel('Date')
                    plt.ylabel('Energy Cost (Joules)')
                    plt.title(title)
                    plt.xticks(rotation=45)
                    plt.grid()
                    
                    pdf.savefig(fig)  # Save the figure to PDF
                    plt.close(fig)

                # Page 2: Daily Energy Consumption Plot
                save_plot(daily, "Energy Cost By Day")

                # Page 3: Monthly Energy Consumption Plot
                save_plot(monthly, "Energy Cost By Month")

                # Page 4: Yearly Energy Consumption Plot
                save_plot(yearly, "Energy Cost By Year")

            print(f"PDF report saved at {pdf_filename}")
            
            # Return the PDF file as a response
            return send_file(pdf_filename, as_attachment=True)

        except Exception as e:
            return jsonify({"error": "Failed to process file", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)