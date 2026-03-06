"""
AgriShield Model Conversion Script
====================================
Converts a trained Keras (.h5) model to TensorFlow.js graph model format
for browser-based offline inference.

Architecture: EfficientNet-B0 + MobileNetV2 hybrid with SE blocks
Dataset:      PlantVillage (38 classes)

Usage:
    pip install tensorflow tensorflowjs
    python convert_model.py --input your_model.h5 --output ../model
"""

import argparse
import os
import json
import numpy as np

def create_dummy_model():
    """
    Creates a dummy TF model for testing when you don't have a trained model yet.
    Replace this with your real trained model.
    """
    try:
        import tensorflow as tf

        print("Creating AgriShield hybrid model (EfficientNet-B0 + MobileNetV2 with SE blocks)...")

        # ── Input ──────────────────────────────────────────────────────────────
        inputs = tf.keras.Input(shape=(224, 224, 3), name="input_image")

        # ── Stream 1: EfficientNet-B0 ──────────────────────────────────────────
        efficientnet_base = tf.keras.applications.EfficientNetB0(
            include_top=False,
            weights="imagenet",
            input_tensor=inputs,
        )
        efficientnet_base.trainable = False  # Freeze for demo
        stream1 = efficientnet_base.output  # (None, 7, 7, 1280)
        stream1 = tf.keras.layers.GlobalAveragePooling2D(name="gap_efficientnet")(stream1)

        # ── Stream 2: MobileNetV2 ──────────────────────────────────────────────
        mobilenet_base = tf.keras.applications.MobileNetV2(
            include_top=False,
            weights="imagenet",
            input_tensor=inputs,
            alpha=1.0,
        )
        mobilenet_base.trainable = False  # Freeze for demo
        stream2 = mobilenet_base.output  # (None, 7, 7, 1280)
        stream2 = tf.keras.layers.GlobalAveragePooling2D(name="gap_mobilenet")(stream2)

        # ── Squeeze-and-Excitation Block ───────────────────────────────────────
        def se_block(x, ratio=16, name_prefix="se"):
            channels = x.shape[-1]
            se = tf.keras.layers.Dense(channels // ratio, activation="relu",  name=f"{name_prefix}_squeeze")(x)
            se = tf.keras.layers.Dense(channels,          activation="sigmoid", name=f"{name_prefix}_excite")(se)
            return tf.keras.layers.Multiply(name=f"{name_prefix}_scale")([x, se])

        stream1 = se_block(stream1, name_prefix="se1")
        stream2 = se_block(stream2, name_prefix="se2")

        # ── Fusion ────────────────────────────────────────────────────────────
        fused = tf.keras.layers.Concatenate(name="fusion")([stream1, stream2])
        fused = tf.keras.layers.Dense(512, activation="relu", name="fc1")(fused)
        fused = tf.keras.layers.Dropout(0.3, name="dropout")(fused)
        fused = tf.keras.layers.Dense(256, activation="relu", name="fc2")(fused)

        # ── Output: 38 PlantVillage classes ───────────────────────────────────
        outputs = tf.keras.layers.Dense(38, activation="softmax", name="predictions")(fused)

        model = tf.keras.Model(inputs=inputs, outputs=outputs, name="AgriShield_Hybrid")

        print(f"Model created: {model.count_params():,} parameters")
        print(f"Input shape: {model.input_shape}")
        print(f"Output shape: {model.output_shape}")

        return model

    except ImportError:
        print("TensorFlow not installed. Install with: pip install tensorflow")
        return None


def convert_to_tfjs(model_path: str, output_dir: str):
    """Convert a saved Keras model to TF.js graph model."""
    try:
        import tensorflowjs as tfjs
        import tensorflow as tf

        print(f"Loading model from: {model_path}")
        model = tf.keras.models.load_model(model_path)

        print(f"Converting to TF.js graph model → {output_dir}")
        os.makedirs(output_dir, exist_ok=True)

        tfjs.converters.save_keras_model(
            model,
            output_dir,
            quantization_dtype_map={"float16": ".*"},  # Quantize to float16 for smaller size
        )

        # Calculate size
        total_size = sum(
            os.path.getsize(os.path.join(output_dir, f))
            for f in os.listdir(output_dir)
        )
        print(f"✅ Conversion complete!")
        print(f"   Output: {output_dir}/")
        print(f"   Size:   {total_size / 1024 / 1024:.1f} MB")
        print(f"\n📁 Copy the output to frontend/public/model/")
        print(f"   cp -r {output_dir}/* ../frontend/public/model/")

    except ImportError:
        print("tensorflowjs not installed. Install with: pip install tensorflowjs")


def create_dummy_tfjs_model(output_dir: str):
    """
    Creates a minimal TF.js model structure for testing the frontend
    without a real trained model.
    """
    import json
    import os
    import numpy as np
    import struct

    os.makedirs(output_dir, exist_ok=True)

    # Model topology matching 38 outputs
    model_json = {
        "format": "graph-model",
        "generatedBy": "AgriShield v1.0",
        "convertedBy": "TensorFlow.js Converter v4.14.0",
        "signature": {
            "inputs": {
                "input_image": {
                    "name": "input_image:0",
                    "dtype": "DT_FLOAT",
                    "tensorShape": {"dim": [{"size": "-1"}, {"size": "224"}, {"size": "224"}, {"size": "3"}]}
                }
            },
            "outputs": {
                "predictions": {
                    "name": "predictions:0",
                    "dtype": "DT_FLOAT",
                    "tensorShape": {"dim": [{"size": "-1"}, {"size": "38"}]}
                }
            }
        },
        "modelTopology": {
            "node": [
                {
                    "name": "input_image",
                    "op": "Placeholder",
                    "attr": {
                        "dtype": {"type": "DT_FLOAT"},
                        "shape": {"shape": {"dim": [{"size": "-1"}, {"size": "224"}, {"size": "224"}, {"size": "3"}]}}
                    }
                },
                {
                    "name": "predictions",
                    "op": "Softmax",
                    "input": ["dense_output"],
                }
            ]
        },
        "weightsManifest": [
            {
                "paths": ["group1-shard1of1.bin"],
                "weights": [
                    {
                        "name": "predictions/kernel",
                        "shape": [256, 38],
                        "dtype": "float32"
                    }
                ]
            }
        ]
    }

    with open(os.path.join(output_dir, "model.json"), "w") as f:
        json.dump(model_json, f, indent=2)

    # Dummy weights
    dummy_weights = np.random.randn(256 * 38).astype(np.float32)
    with open(os.path.join(output_dir, "group1-shard1of1.bin"), "wb") as f:
        f.write(dummy_weights.tobytes())

    print(f"✅ Dummy TF.js model created at: {output_dir}/")
    print("⚠️  This is a DUMMY model — predictions will be random!")
    print("   Replace with your trained model for production use.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AgriShield Model Conversion Tool")
    parser.add_argument("--input",  help="Path to trained Keras .h5 model", default=None)
    parser.add_argument("--output", help="Output directory for TF.js model", default="../model")
    parser.add_argument("--dummy",  action="store_true", help="Create a dummy model for testing")
    parser.add_argument("--build",  action="store_true", help="Build the model architecture (no training)")
    args = parser.parse_args()

    if args.dummy:
        create_dummy_tfjs_model(args.output)
    elif args.input:
        convert_to_tfjs(args.input, args.output)
    elif args.build:
        model = create_dummy_model()
        if model:
            model.summary()
            save_path = "./agrishield_untrained.h5"
            model.save(save_path)
            print(f"Untrained model saved to: {save_path}")
            print("Fine-tune this model on PlantVillage dataset, then convert with --input flag.")
    else:
        print("Usage:")
        print("  python convert_model.py --dummy           # Create dummy model for UI testing")
        print("  python convert_model.py --build           # Build model architecture")  
        print("  python convert_model.py --input model.h5  # Convert trained model")
