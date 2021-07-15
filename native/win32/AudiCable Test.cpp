// AudiCable Test.cpp : 此文件包含 "main" 函数。程序执行将在此处开始并结束。
//



#include <Windows.h>
#include <iostream>
#include <string>


typedef void (*CallBackType)(const char* result);
typedef void (*UIOperationCallBackType)(const char*, const char*);
typedef void (*InitializeType)(const char*, CallBackType);
typedef void (*DeInitializeType)(const char*, CallBackType);
typedef uint64_t(*QueryInterfaceType)(const char*, const char*);
typedef void (*SetUIOperationCallbackType)(UIOperationCallBackType);
void CallBack(const char* result)
{
	std::cout << result << std::endl;
}

int main()
{
	try {
		HMODULE hLib = LoadLibrary(L"resources/com.audicable.audiorecorder/native/MediaConvert.dll");
		//构造
		InitializeType Initialize = (InitializeType)GetProcAddress(hLib, "Initialize");
		std::string init_json = "{'opData':{'appTempPath':'./app','logPath':'./log','appName':'test','appIdentify':'1'}}";
		Initialize(init_json.c_str(), CallBack);
		//析构
		DeInitializeType DeInitialize = (DeInitializeType)GetProcAddress(hLib, "DeInitialize");
		std::string deinit_json = "{'opData':{'appPath':'./app'}}";
		DeInitialize(deinit_json.c_str(), CallBack);
		//前端交互接口
		SetUIOperationCallbackType SetUIOperationCallback = (SetUIOperationCallbackType)GetProcAddress(hLib, "SetUIOperationCallback");
		//SetUIOperationCallback()
		FreeLibrary(hLib);
	}catch (const char* msg) {
		std::cerr << msg << std::endl;
	}
	return 0;
}


/*
#include <Windows.h>
#include <iostream>
typedef int (*FuncType)(int, int);
int main()
{
	HINSTANCE hDllInst;
	hDllInst = LoadLibrary(L"resources/com.audicable.audiorecorder/native/DemoDll.dll"); //调用DLL
	typedef int(*PLUSFUNC)(int a, int b); //后边为参数，前面为返回值
	PLUSFUNC plus_str = (PLUSFUNC)GetProcAddress(hDllInst, "minus"); //GetProcAddress为获取该函数的地址
	std::cout << plus_str(1, 2);
}
*/





// 运行程序: Ctrl + F5 或调试 >“开始执行(不调试)”菜单
// 调试程序: F5 或调试 >“开始调试”菜单

// 入门使用技巧: 
//   1. 使用解决方案资源管理器窗口添加/管理文件
//   2. 使用团队资源管理器窗口连接到源代码管理
//   3. 使用输出窗口查看生成输出和其他消息
//   4. 使用错误列表窗口查看错误
//   5. 转到“项目”>“添加新项”以创建新的代码文件，或转到“项目”>“添加现有项”以将现有代码文件添加到项目
//   6. 将来，若要再次打开此项目，请转到“文件”>“打开”>“项目”并选择 .sln 文件
