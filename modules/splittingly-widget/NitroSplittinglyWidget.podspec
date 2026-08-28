require "json"

# Podspec Nitro modulu SplittinglyWidget. Expo autolinking ho najde přes
# expo-module.config.json -> apple.podspecPaths.
#
# `nitrogen/generated/ios/NitroSplittinglyWidget+autolinking.rb` vzniká z
# `npx nitrogen modules/splittingly-widget`. Dokud codegen neproběhl, soubor
# neexistuje a `pod install` selže s jasnou hláškou -> spusť nitrogen.

Pod::Spec.new do |s|
  s.name         = "NitroSplittinglyWidget"
  s.version      = "0.0.0"
  s.summary      = "Nitro bridge JS -> App Group UserDefaults pro home-screen widget"
  s.homepage     = "https://splittingly.com"
  s.license      = { :type => "UNLICENSED" }
  s.authors      = "Splittingly"
  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "" }

  s.source_files = [
    "ios/**/*.{swift}",
    "ios/**/*.{m,mm}",
    "cpp/**/*.{hpp,cpp}",
  ]

  s.frameworks = "WidgetKit"

  load File.join(__dir__, "nitrogen/generated/ios/NitroSplittinglyWidget+autolinking.rb")
  add_nitrogen_files(s)

  s.dependency "React-jsi"
  s.dependency "React-callinvoker"
  install_modules_dependencies(s)
end
