import { useState, useEffect } from 'react';
import { Label } from '../ui/label';

export interface ImagesFieldProps {
    label: string;
    images?: string[];
    isRequired?: boolean;
    maxImages?: number;
    acceptedFileTypes?: string[];
    onChange?: (images: string[]) => void;
}

export default function ImagesField({
    label,
    images = [],
    isRequired = false,
    maxImages = 10,
    acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    onChange
}: ImagesFieldProps) {
    const [imageList, setImageList] = useState<string[]>(images);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [error, setError] = useState<string>('');

    const remainingSlots = maxImages - imageList.length;
    const canAddMore = imageList.length < maxImages;

    // Notify parent of changes
    useEffect(() => {
        onChange?.(imageList);
    }, [imageList]);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        setError('');

        // Vérifier le nombre d'images
        if (imageList.length + files.length > maxImages) {
            setError(`Vous ne pouvez uploader que ${maxImages} images maximum. Il reste ${remainingSlots} emplacement(s).`);
            return;
        }

        // Vérifier les types de fichiers
        const invalidFiles = files.filter(file => !acceptedFileTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            setError(`Types de fichiers acceptés: ${acceptedFileTypes.map(t => t.split('/')[1]).join(', ')}`);
            return;
        }

        // Convertir les fichiers en URLs
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageList(prev => {
                    const newList = [...prev, reader.result as string];
                    return newList;
                });
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        e.target.value = '';
    }

    function handleRemoveImage(index: number) {
        setImageList(prev => prev.filter((_, i) => i !== index));
        setError('');
    }

    function handleDragStart(index: number) {
        setDraggedIndex(index);
    }

    function handleDragOver(e: React.DragEvent, index: number) {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newImages = [...imageList];
        const draggedImage = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedImage);

        setImageList(newImages);
        setDraggedIndex(index);
    }

    function handleDragEnd() {
        setDraggedIndex(null);
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>
                    {label}
                    <span className="text-destructive" hidden={!isRequired}>*</span>
                </Label>
                <span className="text-sm text-muted-foreground">
                    {imageList.length}/{maxImages} images
                    {canAddMore && ` (${remainingSlots} restant${remainingSlots > 1 ? 's' : ''})`}
                </span>
            </div>

            {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {error}
                </div>
            )}

            {/* Grille d'images */}
            {imageList.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imageList.map((image, index) => (
                        <div
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`
                relative group aspect-square rounded-lg overflow-hidden border-2 
                cursor-move transition-all hover:shadow-lg
                ${draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}
              `}
                        >
                            <img
                                src={image}
                                alt={`Image ${index + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay avec numéro et bouton supprimer */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 transition-colors"
                                    title="Supprimer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            {/* Numéro de l'image */}
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                {index + 1}
                            </div>

                            {/* Icône de déplacement */}
                            <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-medium">Aucune image</p>
                        <p className="text-xs">Cliquez sur le bouton ci-dessous pour ajouter des images</p>
                    </div>
                </div>
            )}

            {/* Input file */}
            <div className="flex items-center gap-2">
                <label
                    className={`
            inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            transition-colors cursor-pointer
            ${canAddMore
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }
          `}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {imageList.length === 0 ? 'Ajouter des images' : 'Ajouter plus d\'images'}
                    <input
                        type="file"
                        multiple
                        accept={acceptedFileTypes.join(',')}
                        onChange={handleFileChange}
                        disabled={!canAddMore}
                        required={isRequired && imageList.length === 0}
                        className="hidden"
                    />
                </label>
                {imageList.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                        Glissez-déposez pour réorganiser
                    </span>
                )}
            </div>
        </div>
    )
}
