package main

import (
	"fmt"
	"syscall/js"
)

func main() {
	fmt.Println("WASM Started")

	// 注册文件系统 API
	fs := js.Global().Get("labor").Get("fs")
	fs.Set("readFile", js.FuncOf(readFile))

	fmt.Println("File system API registered")
	select {}
}

func readFile(this js.Value, args []js.Value) interface{} {
	if len(args) == 0 {
		return js.ValueOf("No file path provided")
	}

	filePath := args[0].String()
	fmt.Printf("Attempting to read file: %s\n", filePath)

	// 使用 fetch 获取文件内容
	return js.Global().Get("fetch").Invoke(filePath).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		return args[0].Call("text")
	}))
}