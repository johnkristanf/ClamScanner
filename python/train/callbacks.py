from keras._tf_keras.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint

def training_callbacks(model_version: str) -> tuple[EarlyStopping, ReduceLROnPlateau, ModelCheckpoint]:

    early_stopping = EarlyStopping(
        monitor='val_loss', 
        patience=5, 
        restore_best_weights=True
    )

    lr_scheduler = ReduceLROnPlateau(
        monitor='val_loss', 
        factor=0.2, 
        patience=3, 
        min_lr=1e-6
    )

    model_checkpoint = ModelCheckpoint(
        filepath=f'./models/ClamScanner_best_v{model_version}.keras',
        monitor='val_loss',
        save_best_only=True
    )

    return early_stopping, lr_scheduler, model_checkpoint
