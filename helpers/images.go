package helpers

import (
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"

	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
)

type ImagesHelpers struct{}

func ImageHelperConfig() *ImagesHelpers {
    return &ImagesHelpers{}
}

type IMAGES_HELPERS_METHODS interface {
    IsImage(filename string) bool
    CountImages(folderPath string) (int, error)
    IsValidImage(file multipart.File) bool
}

func (h *ImagesHelpers) IsImage(filename string) bool {

    validImgExtensions := []string{".jpg", ".jpeg", ".png"}
    extension := strings.ToLower(filepath.Ext(filename))

    for _, imgExt := range validImgExtensions {
        if extension == imgExt {
            return true
        }
    }

    return false
}

func (h *ImagesHelpers) CountImages(folderPath string) (int, error) {
    var count int

    files, err := os.ReadDir(folderPath)
    if err != nil {
        return 0, err
    }

    for _, file := range files {
        if !file.IsDir() && h.IsImage(file.Name()) {
            count++
        }
    }

    return count, nil
}

func (h *ImagesHelpers) IsValidImage(file multipart.File) bool {
    
    _, format, err := image.Decode(file)
    if err != nil {
		fmt.Println("Error in decoding image: ", err)
        return false
    }

    if format != "png" && format != "jpeg" {
		return false
	}

    return true
}
