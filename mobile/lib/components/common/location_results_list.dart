// lib/components/common/location_results_list.dart
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../utils/flags.dart';

const double _locationIconSize = 32.0;
const double _locationIconInnerSize = 14.0;

class LocationResultsList extends StatelessWidget {
  const LocationResultsList({
    super.key,
    required this.results,
    required this.onSelect,
    this.showFlag = false,
    this.showAddress = false,
  });

  final List<Map<String, dynamic>> results;
  final ValueChanged<Map<String, dynamic>> onSelect;
  final bool showFlag;
  final bool showAddress;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: results.length,
      separatorBuilder: (_, __) => Divider(
        height: 1,
        color: dark ? const Color(0x0FFFFFFF) : AppColors.stone100,
      ),
      itemBuilder: (context, i) {
        final r = results[i];
        final flag = showFlag ? getFlagEmoji(r['country_code']?.toString()) : null;
        final name = (r['name'] ?? r['city'] ?? 'Unknown').toString();
        final address = r['formatted_address']?.toString();
        final label = showAddress && address != null && address != name
            ? '$name, $address'
            : name;
        return Semantics(
          button: true,
          label: label,
          child: InkWell(
            onTap: () => onSelect(r),
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 56),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      width: _locationIconSize,
                      height: _locationIconSize,
                      decoration: BoxDecoration(
                        color: dark ? const Color(0x0FFFFFFF) : AppColors.stone100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: flag != null
                          ? ExcludeSemantics(
                              child: Text(flag, style: const TextStyle(fontSize: 16)),
                            )
                          : Icon(
                              Icons.location_on_rounded,
                              size: _locationIconInnerSize,
                              color: dark ? AppColors.stone500 : AppColors.stone400,
                            ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: dark ? AppColors.stone100 : AppColors.stone900,
                            ),
                          ),
                          if (showAddress && address != null && address != name) ...[
                            const SizedBox(height: 2),
                            Text(
                              address,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.stone500,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      size: 16,
                      color: AppColors.stone400,
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}