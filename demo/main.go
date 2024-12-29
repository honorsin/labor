package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"
)

func main() {
	fmt.Println("WASM Started")

	js.Global().Get("labor").Get("http").Set("get", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		fmt.Println("Get handler called")
		path := args[0].String()
		fmt.Printf("Path: %s\n", path)
		return createResponse(path)
	}))

	fmt.Println("Handler registered")
	select {}
}

func createResponse(path string) interface{} {
	fmt.Println("Creating response")
	
	promise := js.Global().Get("Promise").New(js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		resolve := args[0]
		fmt.Println("Promise executor running")

		// 直接解析 Promise，不使用 goroutine
		response := map[string]interface{}{
			"message": "Hello from WASM!",
			"path":    path,
		}

		jsResponse := js.Global().Get("Object").New()
		jsResponse.Set("ok", true)
		jsResponse.Set("status", 200)

		responseBytes, _ := json.Marshal(response)
		uint8Array := js.Global().Get("Uint8Array").New(len(responseBytes))
		js.CopyBytesToJS(uint8Array, responseBytes)

		jsResponse.Set("json", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			return js.Global().Get("Promise").New(js.FuncOf(func(this js.Value, args []js.Value) interface{} {
				resolveJson := args[0]
				resolveJson.Invoke(js.ValueOf(response))
				return nil
			}))
		}))

		fmt.Println("Resolving promise")
		resolve.Invoke(jsResponse)
		return nil
	}))

	fmt.Println("Returning promise")
	return promise
}