package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"syscall/js"
)

func main() {
	fmt.Println("WASM Started")

	// 注册 HTTP 路由处理器
	http.HandleFunc("/api/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		response := map[string]interface{}{
			"message": "Hello from WASM!",
			"path":    r.URL.Path,
		}
		json.NewEncoder(w).Encode(response)
	})

	js.Global().Get("labor").Get("http").Set("get", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		fmt.Println("Get handler called")
		path := args[0].String()
		fmt.Printf("Path: %s\n", path)

		// 创建一个测试请求
		req := httptest.NewRequest("GET", path, nil)
		// 创建一个响应记录器
		rec := httptest.NewRecorder()
		
		// 使用 DefaultServeMux 处理请求
		http.DefaultServeMux.ServeHTTP(rec, req)
		
		// 获取响应结果
		result := rec.Result()
		
		// 创建 JS Response 对象
		jsResponse := js.Global().Get("Object").New()
		jsResponse.Set("ok", result.StatusCode >= 200 && result.StatusCode < 300)
		jsResponse.Set("status", result.StatusCode)
		
		// 设置 json 方法
		jsResponse.Set("json", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			return js.Global().Get("Promise").New(js.FuncOf(func(this js.Value, args []js.Value) interface{} {
				resolveJson := args[0]
				
				var responseData map[string]interface{}
				if err := json.NewDecoder(result.Body).Decode(&responseData); err != nil {
					fmt.Printf("Error decoding response: %v\n", err)
					resolveJson.Invoke(js.ValueOf(map[string]interface{}{
						"error": err.Error(),
					}))
					return nil
				}
				
				resolveJson.Invoke(js.ValueOf(responseData))
				return nil
			}))
		}))

		return jsResponse
	}))

	fmt.Println("Handler registered")
	select {}
}