#pragma once
#include <Windows.h>
#include <napi.h>
#include  <direct.h> 
#include <stdio.h>
#include <stdint.h>

#include<fstream>
#include <exception>
#include <iostream>
#include <string>
#include <map>
#include <direct.h>
#include <cstdlib>

typedef unsigned __int16 uint16_t;
typedef unsigned __int32 uint32_t;
typedef unsigned __int64 uint64_t;


typedef int (*preloadMethodsType)(void);
typedef void (*CallBackType)(const char*);
typedef void (*UIOperationCallBackType)(const char*, const char*);
typedef void (*MusicOperationCallBackType)(uint64_t , const char* result);
typedef void (*InitializeType)(const char*, CallBackType);
typedef void (*DeInitializeType)(const char*, CallBackType);
typedef void (*SetUIOperationCallbackType)(UIOperationCallBackType);
typedef void (*SetUIOperationResultType)(const char*, const char*);
typedef uint64_t (*ExecuteType)(uint64_t,const char*,MusicOperationCallBackType);
typedef void (*AbortExecuteType)(uint64_t,int);
typedef uint64_t(*QueryInterfaceType)(const char*, const char*);
//获得库的绝对路径
std::string GetAbsLibDir()
{
/* 	std::string file=std::string(__FILE__);
	file=file.erase(file.find_last_of('\\'));
	file=file.erase(file.find_last_of('\\'));
	file.append("\\resources");
	std::cout<<"LibDir:"<<file<<std::endl;
	return file; */
	char *buffer = getcwd(NULL, 0);
	std::string file=std::string(buffer);
	file.append("\\native\\win32");
	std::cout<<"LibDir:"<<file<<std::endl;
	return file;
}
HANDLE  MUTEX = NULL;//定义互斥锁
 
//库指针
HMODULE HANDLE_LIB=nullptr;
//客户信息
std::map<char*,std::map<char*,char*> > CLIENT_DATA;
//当前客户url
char* CUR_URL="127.0.0.1:8000";
//初始化回调函数
//params rs:json格式结果
//return void
void InitCallback(const char* rs)
{
	WaitForSingleObject(MUTEX, INFINITE);//等待互斥量
	CLIENT_DATA[CUR_URL]["Init"]=(char*)rs;
	ReleaseMutex(MUTEX);//释放互斥量
} 
//析构回调函数
//params rs:json格式结果
//return void
void DeInitCallback(const char* rs)
{
	WaitForSingleObject(MUTEX, INFINITE);//等待互斥量
	CLIENT_DATA[CUR_URL]["DeInit"]=(char*)rs;
	ReleaseMutex(MUTEX);//释放互斥量
	FreeLibrary(HANDLE_LIB);
}
//界面操作回调函数
//params optype:操作类型 jsonCMD:操作命令
//return void
void UIOperationCallback(const char* opType, const char* jsonCMD)
{
	std::cout<<"UIOperationCallback:"<<std::endl;
	std::cout<<opType<<std::endl;
	std::cout<<jsonCMD<<std::endl;
}
//音乐操作回调函数
//params taskId:工作id rs:json格式结果
//return void
void MusicOperationCallBack(uint64_t taskId,const char* rs)
{
	WaitForSingleObject(MUTEX, INFINITE);//等待互斥量
	CLIENT_DATA[CUR_URL]["MusicResult"]=(char*)rs;
	ReleaseMutex(MUTEX);//释放互斥量
	//std::cout<<"[Addon]MusicOperationCallBack:"<<CLIENT_DATA[CUR_URL]["MusicResult"]<<std::endl;
}
//获取函数指针
//params  func_name:函数名
//return  rs:函数指针
FARPROC GetFunc(char* func_name)
{
	//const char* WIN32_LIB_DIR="./AudiCable addon/resources";
	std::string WIN32_LIB_DIR=GetAbsLibDir();
	std::string preloadLib=WIN32_LIB_DIR+std::string("\\preload.dll");
	std::string mediaConvertLib=WIN32_LIB_DIR+std::string("\\MediaConvert.dll");
	//进行预加载
	auto handle_preload=LoadLibrary(preloadLib.c_str());
	//auto handle_preload=LoadLibrary("D:\\work\\lrm client\\express-test-webpack\\AudiCable addon\\resources\\preload.dll");
	auto preloadMethods=(preloadMethodsType)GetProcAddress(handle_preload,"initialize");
	preloadMethods();
	if (!HANDLE_LIB)
		HANDLE_LIB = LoadLibrary(mediaConvertLib.c_str());
	auto rs=GetProcAddress(HANDLE_LIB, func_name);
	/* std::fstream f("d:\\try.txt", std::ios::out);//供写使用，文件不存在则创建，存在则清空原内容
    f <<"\n"<<"lib handle:" << HANDLE_LIB <<"\n"<<"func handle:"<< rs <<"\n"<<"WIN32_LIB_DIR"<<WIN32_LIB_DIR.c_str();//写入数据 */
	
	/* std::cout<<"lib handle:"<<HANDLE_LIB<<std::endl;
	std::cout<<"func handle:"<<rs<<std::endl; */
	return rs;
}
//获取当前的音乐结果
//params void
//return obj
Napi::String GetCurMusicResult(const Napi::CallbackInfo& info)
{
	Napi::Env env = info.Env();
	//Sleep(1);
	WaitForSingleObject(MUTEX, INFINITE);//等待互斥量
	if (CLIENT_DATA.count(CUR_URL)==0 || CLIENT_DATA[CUR_URL].count("MusicResult") == 0)//无数据
	{
		std::string rs("{\"error\":true,\"errorCode\":0}");
		ReleaseMutex(MUTEX);//释放互斥量
		return Napi::String::New(env,rs);
	}	
	std::cout<<"[Addon]GetCurMusicResult:"<<CLIENT_DATA[CUR_URL]["MusicResult"]<<std::endl;
	ReleaseMutex(MUTEX);//释放互斥量
	return Napi::String::New(env,CLIENT_DATA[CUR_URL]["MusicResult"]);
	
}


//AudiCable的初始化
//params info:参数列表,参数一是json字符串(格式在文档中)
//return rs:json结果字符串
Napi::String Initialize(const Napi::CallbackInfo& info)
{
	Napi::Env env = info.Env();
	//判断输入参数个数
	if (info.Length() < 1) 
	{
		Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
		return Napi::String::New(env,"");
	}
	MUTEX = CreateMutex(NULL, FALSE, NULL);
	//获取json字符串
	Napi::String init_json = info[0].As<Napi::String>();  
	//获取函数
	try  
    {  
        auto SetUIOperationCallback=(SetUIOperationCallbackType)GetFunc("SetUIOperationCallback");
		auto Initialize=(InitializeType)GetFunc("Initialize");
		Initialize(init_json.Utf8Value().c_str(),InitCallback);	
		SetUIOperationCallback(UIOperationCallback);
		return Napi::String::New(env,CLIENT_DATA[CUR_URL]["Init"]);
    }  
    catch (std::exception e)  
    {  
        std::cout << "Standard exception: " << e.what() << std::endl;  
		return Napi::String::New(env,"func or lib load error!");
    }  
}

//AudiCable的设置UI回调
//params info:参数列表,参数一是json字符串(格式在文档中)
//return rs:json结果字符串
Napi::String DeInitialize(const Napi::CallbackInfo& info)
{
	Napi::Env env = info.Env();
	//判断输入参数个数
	if (info.Length() < 1) 
	{
		Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
		return Napi::String::New(env,"");
	}
	//获取json字符串
	Napi::String init_json = info[0].As<Napi::String>();  	
	//获取函数
	auto DeInitialize=(InitializeType)GetFunc("DeInitialize");
	DeInitialize(init_json.Utf8Value().c_str(),DeInitCallback);	
	return Napi::String::New(env,CLIENT_DATA[CUR_URL]["DeInit"]);
}
//AudiCable的设置操作结果
//params info:参数列表,参数一是操作类型,参数二是结果json字符串
//return void
void SetUIOperationResult(const Napi::CallbackInfo& info)
{
	Napi::Env env = info.Env();
	//判断输入参数个数
	if (info.Length() < 2) 
	{
		Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
		return ;
	}
	//获取操作类型
	Napi::String opType = info[0].As<Napi::String>();  	
	//获取结果json
	Napi::String result = info[1].As<Napi::String>();  
	//获取函数
	auto SetUIOperationResult=(SetUIOperationResultType)GetFunc("SetUIOperationResult");
	SetUIOperationResult(opType.Utf8Value().c_str(),result.Utf8Value().c_str());
}
//AudiCable的寻找接口
//params info:参数列表,参数一是模块类型,参数二是标签
//return rs:模块指针
Napi::Number  QueryInterface(const Napi::CallbackInfo& info)
{
	
	Napi::Env env = info.Env();
	//判断输入参数个数
	if (info.Length() < 2) 
	{
		Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
		return Napi::Number::New(env,0);
	}
	//获取模板类型
	Napi::String moduleType = info[0].As<Napi::String>();  	
	//获取标签
	Napi::String appTag = info[1].As<Napi::String>();  
	/* std::cout<<"moduleType:"<<moduleType.Utf8Value().c_str()<<std::endl;
	std::cout<<"appTag:"<<appTag.Utf8Value().c_str()<<std::endl; */
	//获取函数
	auto QueryInterface=(QueryInterfaceType)GetFunc("QueryInterface");
	uint64_t rs=QueryInterface(moduleType.Utf8Value().c_str(),appTag.Utf8Value().c_str());
	return Napi::Number::New(env,rs);
} 
//AudiCable的执行函数
//params info:参数列表,参数一是模块类型,参数二是标签
//return obj:返回对象
Napi::Object  Execute(const Napi::CallbackInfo& info)
{
	
	Napi::Env env = info.Env();
	//判断输入参数个数
	if (info.Length() < 2) 
	{
		Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
		return Napi::Object::New(env);
	}
	//获取接口
	Napi::Number InterFace= info[0].As<Napi::Number>();
	//获取标签
	Napi::String jsonCMD = info[1].As<Napi::String>();   
	//获取函数
	auto Execute=(ExecuteType)GetFunc("Execute");
	uint64_t taskId=Execute(InterFace.Int64Value(),jsonCMD.Utf8Value().c_str(),MusicOperationCallBack);
	auto obj=Napi::Object::New(env);
	obj.Set("TaskID",Napi::Number::New(env,taskId));
	obj.Set("Result",CLIENT_DATA[CUR_URL]["MusicResult"]);
	return obj;
	
} 

//AudiCable的中止函数
//params info:参数列表,参数一是模块类型,参数二是模块指针
//return void
void  AbortExecute(const Napi::CallbackInfo& info)
{
	
	Napi::Env env = info.Env();
	//判断输入参数个数
	if (info.Length() < 2) 
	{
		Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
		return ;
	}
	//获取接口
	Napi::Number InterFace= info[0].As<Napi::Number>();
	//获取标签
	Napi::Number taskId = info[1].As<Napi::Number>();  
	//获取函数
	auto AbortExecute=(AbortExecuteType)GetFunc("AbortExecute");
	try {
		AbortExecute(InterFace.Int64Value(),taskId.Int32Value());
		std::cout<<"Abort Success!"<<std::endl;
    }catch (const char* msg) {
		std::cerr << msg << std::endl;
	}
} 
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  //获取当前的音乐结果
  exports.Set(Napi::String::New(env, "GetCurMusicResult"), Napi::Function::New(env, GetCurMusicResult));
  //构造函数
  exports.Set(Napi::String::New(env, "Initialize"), Napi::Function::New(env, Initialize));
  //析构函数
  exports.Set(Napi::String::New(env, "DeInitialize"), Napi::Function::New(env, DeInitialize));
  //寻找接口函数
  exports.Set(Napi::String::New(env, "QueryInterface"), Napi::Function::New(env, QueryInterface));
  //执行函数
  exports.Set(Napi::String::New(env, "Execute"), Napi::Function::New(env, Execute));
  //中止函数
  exports.Set(Napi::String::New(env, "AbortExecute"), Napi::Function::New(env, AbortExecute));
  //设置操作结果函数
  exports.Set(Napi::String::New(env, "SetUIOperationResult"), Napi::Function::New(env, SetUIOperationResult));
  return exports;
}

NODE_API_MODULE(audi_cable, Init)
