from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import subprocess
from tiktokendemo import ttk
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Set the backend to non-interactive
import matplotlib.pyplot as plt
from matplotlib.dates import DateFormatter
import io
import base64

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for frontend

# Set the folder to store uploaded files
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'conversations')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


# def save_plot(data, x_label, y_label, title, filename):
#     """
#     Helper function to create and save a plot.
    
#     Args:
#         data (tuple): A tuple of (x_values, y_values) for plotting.
#         x_label (str): Label for the x-axis.
#         y_label (str): Label for the y-axis.
#         title (str): Title of the plot.
#         filename (str): Name of the file to save the plot.
#     """
#     fig, ax = plt.subplots(figsize=(10, 5))
#     ax.plot(data[0], data[1], marker='o', linestyle='-')
#     plt.xlabel(x_label)
#     plt.ylabel(y_label)
#     plt.title(title)
#     plt.xticks(rotation=45)
#     plt.grid()

#     # Save the plot to a file
#     plot_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
#     plt.savefig(plot_path, format='png')
#     plt.close(fig)
#     print(f"Plot saved to {plot_path}")
#     return plot_path




@app.route('/')
def home():
    # Serve the index.html file
    return render_template('index.html')

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
            script_path = os.path.join(os.path.dirname(__file__), 'tiktokendemo.py')
            print("Running tiktokendemo.py from", script_path)
            print(file_path)

            # Call the function directly
            total_joules, daily, monthly, yearly = ttk(file_path)
            print("done with call tiktoken")

            # Create the plot
            fig, ax = plt.subplots(figsize=(10, 5))
            ax.plot(daily[0], daily[1], marker='o', linestyle='-')
            print("plotting daily")

            plt.xlabel('Date')
            plt.ylabel('Energy Consumption (Joules)')
            plt.title('Energy Consumption By Month')
            plt.xticks(rotation=45)
            plt.grid()
            

            # Save the plot to a PNG file
            plot_filename = os.path.join(app.config['UPLOAD_FOLDER'], 'energy_consumption_plot.png')
            plt.savefig(plot_filename, format='png')
            plt.close(fig)
            print("image saved to", plot_filename)




             # Create the plot
            fig, ax = plt.subplots(figsize=(10, 5))
            ax.plot(monthly[0], monthly[1], marker='o', linestyle='-')
            print("plotting monthly")

            plt.xlabel('Date')
            plt.ylabel('Energy Consumption (Joules)')
            plt.title('Energy Consumption By Month')
            plt.xticks(rotation=45)
            plt.grid()
            

            # Save the plot to a PNG file
            plot_filename = os.path.join(app.config['UPLOAD_FOLDER'], 'energy_consumption_plot_monthly.png')
            plt.savefig(plot_filename, format='png')
            plt.close(fig)
            print("image saved to", plot_filename)






             # Create the plot
            fig, ax = plt.subplots(figsize=(10, 5))
            ax.plot(yearly[0], yearly[1], marker='o', linestyle='-')
            print("plotting yearly")

            plt.xlabel('Date')
            plt.ylabel('Energy Consumption (Joules)')
            plt.title('Energy Consumption By Month')
            plt.xticks(rotation=45)
            plt.grid()
            

            # Save the plot to a PNG file
            plot_filename = os.path.join(app.config['UPLOAD_FOLDER'], 'energy_consumption_plot_yea.png')
            plt.savefig(plot_filename, format='png')
            plt.close(fig)
            print("image saved to", plot_filename)











            # Save daily plot
            # print(daily_plot_path = save_plot(
            #     daily,
            #     x_label='Date',
            #     y_label='Energy Consumption',
            #     title='Daily Energy Consumption Over Time',
            #     filename='daily_energy_consumption.png'
            # ))

            # # Save monthly plot
            # print(monthly_plot_path = save_plot(
            #     monthly,
            #     x_label='Date',
            #     y_label='Energy Consumption',
            #     title='Monthly Energy Consumption Over Time',
            #     filename='monthly_energy_consumption.png'
            # ))

            # # Save yearly plot
            # print(yearly_plot_path = save_plot(
            #     yearly,
            #     x_label='Date',
            #     y_label='Energy Consumption',
            #     title='Yearly Energy Consumption Over Time',
            #     filename='yearly_energy_consumption.png'
            # ))

            return jsonify({"message": "File uploaded and plot saved successfully", "plot_filename": plot_filename}), 200
        except Exception as e:
            return jsonify({"error": "Failed to process file", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)